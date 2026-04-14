CREATE TABLE `avatar_offsets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`avatarId` varchar(64) NOT NULL,
	`offsetX` float NOT NULL DEFAULT 0,
	`offsetY` float NOT NULL DEFAULT 0,
	`imgScale` float NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avatar_offsets_id` PRIMARY KEY(`id`),
	CONSTRAINT `avatar_offsets_avatarId_unique` UNIQUE(`avatarId`)
);
