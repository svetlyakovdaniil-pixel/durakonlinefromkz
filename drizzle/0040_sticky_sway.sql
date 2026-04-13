CREATE TABLE `season_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`seasonKey` varchar(7) NOT NULL,
	`seasonRating` int NOT NULL DEFAULT 0,
	`gamesPlayed` int NOT NULL DEFAULT 0,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `season_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `season_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`seasonKey` varchar(7) NOT NULL,
	`finalRating` int NOT NULL,
	`rankKey` varchar(32) NOT NULL,
	`shanyraksAwarded` int NOT NULL DEFAULT 0,
	`tengeAwarded` int NOT NULL DEFAULT 0,
	`claimed` boolean NOT NULL DEFAULT false,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `season_rewards_id` PRIMARY KEY(`id`)
);
