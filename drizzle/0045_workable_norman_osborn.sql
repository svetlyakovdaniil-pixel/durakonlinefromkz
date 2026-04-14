CREATE TABLE `season_test_state` (
	`id` int NOT NULL DEFAULT 1,
	`seasonKey` varchar(16) NOT NULL,
	`step` varchar(32) NOT NULL DEFAULT 'idle',
	`isActive` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `season_test_state_id` PRIMARY KEY(`id`)
);
