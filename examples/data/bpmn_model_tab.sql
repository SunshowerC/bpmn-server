

drop table IF  EXISTS `bpmn_model_tab`;
CREATE TABLE IF NOT EXISTS `bpmn_model_tab` (
  `id` char(36) NOT NULL ,
  `name` varchar(200) NOT NULL,
  `events` json DEFAULT NULL,
  `processes` json DEFAULT NULL,
  `saved` varchar(36) DEFAULT NULL ,
  `source` text ,
  `svg` text ,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT  CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


drop table IF  EXISTS `bpmn_instance_tab`;
CREATE TABLE IF NOT EXISTS `bpmn_instance_tab` (
  `id` char(36) NOT NULL ,
  `parentItemId` varchar(36) DEFAULT NULL ,

  `name` varchar(200) NOT NULL,
  `status` varchar(200) NOT NULL,

  `items` json DEFAULT NULL,
  `tokens` json DEFAULT NULL,
  `loops` json DEFAULT NULL,
  `logs` json DEFAULT NULL,
  `data` json DEFAULT NULL,
   
  `source` text ,

  `saved` varchar(36)  DEFAULT NULL,
  `startedAt` varchar(36)  DEFAULT NULL,
  `endedAt` varchar(36)  DEFAULT NULL,

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT  CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

