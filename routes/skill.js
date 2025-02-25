
const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const { validate: isUuid } = require('uuid');
const appError = require('../utils/appError')
const logger = require('../utils/logger')('Skill')
const { isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators');


router.get('/', async (req, res, next) => {
  try {
    const skill = await dataSource.getRepository('Skill').find({
      select: ['id', 'name']
    })
    res.status(200).json({
      status: 'success',
      data: skill
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body
    if (isUndefined(name) || isNotValidString(name)) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    const skillRepo = await dataSource.getRepository('Skill')
    const existSkill = await skillRepo.find({
      where: {
        name
      }
    })
    if (existSkill.length > 0) {
      next(appError(409,"資料重複"))
      return
    }
    const newSkill = await skillRepo.create({
      name
    })
    const result = await skillRepo.save(newSkill)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

router.delete('/:skillId', async (req, res, next) => {
  try {
    const skillId = req.params.skillId
    if (!isUuid(skillId)) {
      next(appError(400,"ID格式錯誤，請提供有效的UUID"))
      return 
    }
    const result = await dataSource.getRepository('Skill').delete(skillId)
    if (result.affected === 0) {
      next(appError(400,"ID錯誤"))
      return
    }
    res.status(200).json({
      status: 'success',
      data: result
    })
    res.end()
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router