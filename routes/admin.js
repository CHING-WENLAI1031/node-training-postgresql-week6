const express = require('express')

const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const { isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators');
const appError = require('../utils/appError')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})
const isCoach = require('../middlewares/isCoach')

//新增教練課程
router.post('/coaches/courses',auth, isCoach ,async (req, res, next) => {
try {
const {
  user_id: userId, skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
  max_participants: maxParticipants, meeting_url: meetingUrl
} = req.body
if (isUndefined(userId) || isNotValidString(userId) ||
  isUndefined(skillId) || isNotValidString(skillId) ||
  isUndefined(name) || isNotValidString(name) ||
  isUndefined(description) || isNotValidString(description) ||
  isUndefined(startAt) || isNotValidString(startAt) ||
  isUndefined(endAt) || isNotValidString(endAt) ||
  isUndefined(maxParticipants) || isNotValidInteger(maxParticipants) ||
  isUndefined(meetingUrl) || isNotValidString(meetingUrl) || !meetingUrl.startsWith('https')) {
  logger.warn('欄位未填寫正確')
  /*res.status(400).json({
    status: 'failed',
    message: '欄位未填寫正確'
  })
  return*/
  next(appError(400, "欄位未填寫正確"))
  return 
}
const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
if(!datePattern.test(startAt)||!datePattern.test(endAt)){
  next(appError(400,"日期格式錯誤，請使用 ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ"))
  return
}

const userRepository = dataSource.getRepository('User')
const existingUser = await userRepository.findOne({
  select: ['id', 'name', 'role'],
  where: { id: userId }
})
if (!existingUser) {
  logger.warn('使用者不存在')
  next(appError(400,"使用者不存在"))
  return
} else if (existingUser.role !== 'COACH') {
  logger.warn('使用者尚未成為教練')
  next(appError(400,"使用者尚未成為教練"))
  return
}
const courseRepo = dataSource.getRepository('Course')
const newCourse = courseRepo.create({
  user_id: userId,
  skill_id: skillId,
  name,
  description,
  start_at: startAt,
  end_at: endAt,
  max_participants: maxParticipants,
  meeting_url: meetingUrl
})
const savedCourse = await courseRepo.save(newCourse)
const course = await courseRepo.findOne({
  where: { id: savedCourse.id }
})
res.status(201).json({
  status: 'success',
  data: {
    course
  }
})
} catch (error) {
logger.error(error)
next(error)
}
})
//編輯教練課程
router.put('/coaches/courses/:courseId',auth, isCoach, async (req, res, next) => {
try {
const { courseId } = req.params
const {
  skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
  max_participants: maxParticipants, meeting_url: meetingUrl
} = req.body
if (isNotValidString(courseId) ||
  isUndefined(skillId) || isNotValidString(skillId) ||
  isUndefined(name) || isNotValidString(name) ||
  isUndefined(description) || isNotValidString(description) ||
  isUndefined(startAt) || isNotValidString(startAt) ||
  isUndefined(endAt) || isNotValidString(endAt) ||
  isUndefined(maxParticipants) || isNotValidInteger(maxParticipants) ||
  isUndefined(meetingUrl) || isNotValidString(meetingUrl) || !meetingUrl.startsWith('https')) {
  logger.warn('欄位未填寫正確')
  next(appError(400, "欄位未填寫正確"))
  return
}
const courseRepo = dataSource.getRepository('Course')
const existingCourse = await courseRepo.findOneBy({
  id: courseId 
})
if (!existingCourse) {
  logger.warn('課程不存在')
  next(appError(400, "課程不存在"))
  return
}
const updateCourse = await courseRepo.update({
  id: courseId
}, {
  skill_id: skillId,
  name,
  description,
  start_at: startAt,
  end_at: endAt,
  max_participants: maxParticipants,
  meeting_url: meetingUrl
})
if (updateCourse.affected === 0) {
  logger.warn('更新課程失敗')
  next(appError(400, "更新課程失敗"))
  return
}
const savedCourse = await courseRepo.findOneBy({
  id: courseId 
})
res.status(200).json({
  status: 'success',
  data: {
    course: savedCourse
  }
})
} catch (error) {
logger.error(error)
next(error)
}
})
//使用者變更為教練
router.post('/coaches/:userId', async (req, res, next) => {
try {
const { userId } = req.params
const { experience_years: experienceYears, description, profile_image_url: profileImageUrl = null } = req.body
if (isUndefined(experienceYears) || isNotValidInteger(experienceYears) || isUndefined(description) || isNotValidString(description)) {
  logger.warn('欄位未填寫正確')
  next(appError(400, "欄位未填寫正確"))
  return
}
if (profileImageUrl && !isNotValidString(profileImageUrl) && !profileImageUrl.startsWith('https')) {
  logger.warn('大頭貼網址錯誤')
  next(appError(400, "大頭貼網址錯誤"))
  return
}
const userRepository = dataSource.getRepository('User')
const existingUser = await userRepository.findOne({
  select: ['id', 'name', 'role'],
  where: { id: userId }
})
if (!existingUser) {
  logger.warn('使用者不存在')
  next(appError(400, "使用者不存在"))
  return
} else if (existingUser.role === 'COACH') {
  logger.warn('使用者已經是教練')
  next(appError(409, "使用者已經是教練"))
  return
}
const coachRepo = dataSource.getRepository('Coach')
const newCoach = coachRepo.create({
  user_id: userId,
  experience_years: experienceYears,
  description,
  profile_image_url: profileImageUrl
})
const updatedUser = await userRepository.update({
  id: userId,
  role: 'USER'
}, {
  role: 'COACH'
})
if (updatedUser.affected === 0) {
  logger.warn('更新使用者失敗')
  next(appError(400, "更新使用者失敗"))
  return
}
const savedCoach = await coachRepo.save(newCoach)
const savedUser = await userRepository.findOne({
  select: ['name', 'role'],
  where: { id: userId }
})
res.status(201).json({
  status: 'success',
  data: {
    user: savedUser,
    coach: savedCoach
  }
})
} catch (error) {
logger.error(error)
next(error)
}
})

module.exports = router