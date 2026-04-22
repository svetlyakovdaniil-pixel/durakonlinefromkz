CREATE TABLE `ghost_learning` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionType` varchar(32) NOT NULL,
	`cardRank` varchar(8),
	`isTrump` boolean NOT NULL DEFAULT false,
	`isValuable` boolean NOT NULL DEFAULT false,
	`handSize` int NOT NULL,
	`battlefieldSize` int NOT NULL,
	`isMultiCard` boolean NOT NULL DEFAULT false,
	`multiCardCount` int NOT NULL DEFAULT 1,
	`playerCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ghost_learning_id` PRIMARY KEY(`id`)
);
