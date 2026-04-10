CREATE TABLE `admin_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`adminName` varchar(100),
	`action` enum('ban','unban','temp_ban','update_balance','reset_stats','change_role','kick','update_shop_item','create_shop_item','toggle_shop_item','mass_notify') NOT NULL,
	`targetProfileId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mass_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`adminName` varchar(100),
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`segment` enum('all','inactive_7d','top_100','newbies') NOT NULL,
	`sentCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mass_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `bannedUntil` timestamp;