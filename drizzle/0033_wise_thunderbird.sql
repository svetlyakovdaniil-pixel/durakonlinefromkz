CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`achievementKey` varchar(64) NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`unlocked` boolean NOT NULL DEFAULT false,
	`claimed` boolean NOT NULL DEFAULT false,
	`unlockedAt` timestamp,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
