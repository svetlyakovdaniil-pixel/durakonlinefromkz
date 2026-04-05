CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`type` enum('friend_request','friend_accepted','balance_topup') NOT NULL,
	`data` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
