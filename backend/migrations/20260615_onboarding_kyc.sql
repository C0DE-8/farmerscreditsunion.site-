-- Adds admin-reviewed onboarding/KYC before customer account numbers are issued.
-- Apply after the existing schema.

ALTER TABLE users
  MODIFY account_number VARCHAR(50) NULL,
  MODIFY acct_status VARCHAR(20) NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS user_onboarding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  work_id VARCHAR(100) NOT NULL,
  id_type ENUM('passport', 'driver_license') NOT NULL,
  id_front_url VARCHAR(255) NOT NULL,
  id_back_url VARCHAR(255) NOT NULL,
  face_photo_url VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  address VARCHAR(255) NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_onboarding_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_onboarding_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ON DELETE SET NULL,
  UNIQUE KEY uq_user_onboarding_user (user_id),
  KEY idx_user_onboarding_status (status),
  KEY idx_user_onboarding_created_at (created_at)
);
