CREATE TABLE `ghost_strategy_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ghostId` varchar(64) NOT NULL,
	`strategyJson` text NOT NULL DEFAULT ('{}'),
	`gamesAnalyzed` int NOT NULL DEFAULT 0,
	`winRate` float NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ghost_strategy_profile_id` PRIMARY KEY(`id`),
	CONSTRAINT `ghost_strategy_profile_ghostId_unique` UNIQUE(`ghostId`)
);
