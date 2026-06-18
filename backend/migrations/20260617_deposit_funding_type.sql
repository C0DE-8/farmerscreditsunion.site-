ALTER TABLE deposits
  ADD COLUMN deposit_type ENUM('topup_account', 'fix_issue') NOT NULL DEFAULT 'topup_account' AFTER wallet_id,
  ADD COLUMN account_type ENUM('savings', 'current') NOT NULL DEFAULT 'current' AFTER deposit_type,
  ADD COLUMN note TEXT NULL AFTER proof_path,
  ADD COLUMN reviewed_at DATETIME NULL AFTER created_at;

UPDATE deposits
SET deposit_type = 'topup_account',
    account_type = 'current'
WHERE deposit_type IS NULL
   OR account_type IS NULL;
