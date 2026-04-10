CREATE TABLE `shop_price_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemType` enum('deck','table','frame') NOT NULL,
	`itemId` varchar(64) NOT NULL,
	`priceTenge` int,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_price_overrides_id` PRIMARY KEY(`id`)
);
