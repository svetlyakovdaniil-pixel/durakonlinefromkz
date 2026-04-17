CREATE TABLE `server_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `server_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `server_settings_key_unique` UNIQUE(`key`)
);
