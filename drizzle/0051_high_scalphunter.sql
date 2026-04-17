ALTER TABLE `shop_price_overrides` MODIFY COLUMN `itemType` enum('deck','table','frame','avatar','playlist') NOT NULL;--> statement-breakpoint
ALTER TABLE `shop_price_overrides` ADD `discountPercent` int;--> statement-breakpoint
ALTER TABLE `shop_price_overrides` ADD `discountExpiresAt` timestamp;