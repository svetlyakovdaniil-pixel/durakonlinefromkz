CREATE TABLE `user_daily_quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`questKey` varchar(64) NOT NULL,
	`dayStartTs` bigint NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`claimed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_daily_quests_id` PRIMARY KEY(`id`)
);
