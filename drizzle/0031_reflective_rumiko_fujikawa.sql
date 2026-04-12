CREATE TABLE `iap_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`transactionId` varchar(255) NOT NULL,
	`productId` varchar(100) NOT NULL,
	`iap_platform` enum('ios','android') NOT NULL,
	`tengeCredited` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `iap_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `iap_transactions_transactionId_unique` UNIQUE(`transactionId`)
);
