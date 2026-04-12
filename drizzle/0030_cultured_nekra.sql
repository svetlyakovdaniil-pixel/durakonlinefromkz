CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int,
	`senderName` varchar(100) NOT NULL,
	`replyEmail` varchar(320) NOT NULL,
	`message` text NOT NULL,
	`contact_status` enum('new','read','replied') NOT NULL DEFAULT 'new',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
