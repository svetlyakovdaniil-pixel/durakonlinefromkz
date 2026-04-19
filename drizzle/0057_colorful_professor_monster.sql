CREATE TABLE `push_notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`notifType` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_notification_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`token` varchar(512) NOT NULL,
	`platform` varchar(16) NOT NULL DEFAULT 'android',
	`appVersion` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_tokens_id` PRIMARY KEY(`id`)
);
