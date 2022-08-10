/*
 Navicat Premium Data Transfer

 Source Server         : mongo
 Source Server Type    : MongoDB
 Source Server Version : 50010
 Source Host           : localhost:27017
 Source Schema         : bpmn

 Target Server Type    : MongoDB
 Target Server Version : 50010
 File Encoding         : 65001

 Date: 11/08/2022 03:19:54
*/


// ----------------------------
// Collection structure for wf_models
// ----------------------------
db.getCollection("wf_models").drop();
db.createCollection("wf_models");
