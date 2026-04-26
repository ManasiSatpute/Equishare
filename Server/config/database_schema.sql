-- Payment related tables
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    rental_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'CASH_ON_DELIVERY') NOT NULL,
    transaction_id VARCHAR(100),
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Delivery tracking
CREATE TABLE delivery_status (
    delivery_id INT PRIMARY KEY AUTO_INCREMENT,
    rental_id INT NOT NULL,
    payment_id INT NOT NULL,
    status ENUM('PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED') DEFAULT 'PENDING',
    delivery_address TEXT NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
);

-- Return management
CREATE TABLE returns (
    return_id INT PRIMARY KEY AUTO_INCREMENT,
    rental_id INT NOT NULL,
    status ENUM('REQUESTED', 'IN_TRANSIT', 'RECEIVED', 'COMPLETED') DEFAULT 'REQUESTED',
    return_date DATE NOT NULL,
    actual_return_date DATE,
    condition_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE
);

-- Rental history for auditing
CREATE TABLE rental_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    rental_id INT NOT NULL,
    equipment_id INT NOT NULL,
    user_id INT NOT NULL,
    action_type ENUM('CREATED', 'UPDATED', 'RETURNED', 'DELETED') NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Deleted rentals tracking
CREATE TABLE deleted_rentals (
    deleted_id INT PRIMARY KEY AUTO_INCREMENT,
    original_rental_id INT,
    equipment_id INT,
    user_id INT,
    rental_start_date DATE,
    rental_end_date DATE,
    deletion_reason TEXT,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- VIEWS --

-- User Orders View
CREATE VIEW user_orders_view AS
SELECT 
    r.id as rental_id,
    u.name as user_name,
    e.name as equipment_name,
    r.rental_start_date,
    r.rental_end_date,
    p.payment_status,
    p.payment_mode,
    d.status as delivery_status,
    ret.status as return_status
FROM rentals r
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN equipment e ON r.equipment_id = e.id
LEFT JOIN payments p ON r.id = p.rental_id
LEFT JOIN delivery_status d ON r.id = d.rental_id
LEFT JOIN returns ret ON r.id = ret.rental_id;

-- Owner Deliveries View
CREATE VIEW owner_deliveries_view AS
SELECT 
    d.delivery_id,
    e.name as equipment_name,
    u.name as renter_name,
    d.delivery_address,
    d.status,
    d.expected_delivery_date,
    e.owner_id
FROM delivery_status d
JOIN rentals r ON d.rental_id = r.id
JOIN equipment e ON r.equipment_id = e.id
JOIN users u ON r.user_id = u.id
WHERE d.status != 'DELIVERED';

-- Returns Overview View
CREATE VIEW returns_overview_view AS
SELECT 
    e.id as equipment_id,
    e.name as equipment_name,
    COUNT(r.return_id) as total_returns,
    SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_returns,
    AVG(DATEDIFF(r.actual_return_date, r.return_date)) as avg_return_days
FROM equipment e
LEFT JOIN rentals rent ON e.id = rent.equipment_id
LEFT JOIN returns r ON rent.id = r.rental_id
GROUP BY e.id, e.name;

-- TRIGGERS --

-- Trigger for payment success to create delivery entry
DELIMITER //
CREATE TRIGGER after_payment_success
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'COMPLETED' AND OLD.payment_status != 'COMPLETED' THEN
        INSERT INTO delivery_status (rental_id, payment_id, delivery_address)
        SELECT r.id, NEW.payment_id, u.address
        FROM rentals r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = NEW.rental_id;
    END IF;
END;//
DELIMITER ;

-- Trigger for logging rental history
DELIMITER //
CREATE TRIGGER after_rental_update
AFTER UPDATE ON rentals
FOR EACH ROW
BEGIN
    INSERT INTO rental_history (
        rental_id, 
        equipment_id, 
        user_id, 
        action_type,
        old_status,
        new_status
    )
    VALUES (
        NEW.id,
        NEW.equipment_id,
        NEW.user_id,
        'UPDATED',
        OLD.status,
        NEW.status
    );
END;//
DELIMITER ;

-- Trigger for deleted rentals
DELIMITER //
CREATE TRIGGER before_rental_delete
BEFORE DELETE ON rentals
FOR EACH ROW
BEGIN
    INSERT INTO deleted_rentals (
        original_rental_id,
        equipment_id,
        user_id,
        rental_start_date,
        rental_end_date,
        deletion_reason
    )
    VALUES (
        OLD.id,
        OLD.equipment_id,
        OLD.user_id,
        OLD.rental_start_date,
        OLD.rental_end_date,
        'Rental record deleted'
    );
END;//
DELIMITER ;

-- EVENT for checking expired rentals
DELIMITER //
CREATE EVENT check_expired_rentals
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_rental_id INT;
    DECLARE v_end_date DATE;
    
    -- Cursor for expired rentals
    DECLARE expired_rentals CURSOR FOR
        SELECT id, rental_end_date 
        FROM rentals 
        WHERE rental_end_date <= CURDATE()
        AND id NOT IN (SELECT rental_id FROM returns);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN expired_rentals;
    
    read_loop: LOOP
        FETCH expired_rentals INTO v_rental_id, v_end_date;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Create return request
        INSERT INTO returns (rental_id, return_date)
        VALUES (v_rental_id, v_end_date);
        
    END LOOP;
    
    CLOSE expired_rentals;
END;//
DELIMITER ;