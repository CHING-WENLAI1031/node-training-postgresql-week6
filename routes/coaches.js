const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const { validate: isUuid } = require('uuid');
const appError = require('../utils/appError')
const logger = require('../utils/logger')('Coaches')
const { isUndefined, isNotValidString, isNotValidInteger } = require('../utils/validators');

//取得教練列表
router.get('/', async (req, res, next) => {
  try {
    //做成迴圈？
    let{ per, page } = req.query;
    
    if(isNotValidString(per) || isNotValidString(page)) {
      next(appError(400, "欄位未填寫正確"))
      return
    }
    per =  parseInt(per);
    page = parseInt(page);
    
    if(per<=0||page<=0){
      next(appError(400, "頁碼以及顯示筆數須大於0，請檢查輸入數值"))
      return
    }
    const take = per;
    const skip = (page-1)*per;

    const coaches = await dataSource.getRepository("Coach").find({
        select: {
          id: true,
          user_id: { name: true },
          created_at:true
        },
        order: {created_at: "ASC" },
        take,
        skip,
        relations: ['User']
      });
      
      const result = coaches.map(coach => ({
        id: coach.id,
        name: coach.User.name   
      }));
      
    res.status(200).json({
      status: 'success',
      data: result
    })


  } catch (error) {
    logger.error(error)
    next(error)
  }
})
//取得教練詳細資訊
router.get('/:coachId', async (req, res, next) => {
    try {
        const {coachId} = req.params
        if (!isUuid(coachId)) {
            next(appError(400, "ID格式錯誤，請提供有效的UUID"))
            return 
          }
        const coach = await dataSource.getRepository('Coach').findOne({
        where: { id: coachId }
        })
        if (!coach) {
            logger.warn('此教練ID不存在')
            next(appError(400, "找不到該教練"))
            return
        }
        const user = await dataSource.getRepository('User').findOne({
                        select: ["name", "role"],
                        where: { id: coach.user_id }
                        })
          
        res.status(200).json({
          status: 'success',
          data: {
            user,
            coach}
        })
    } catch (error) {
      logger.error(error)
      next(error)
    }
})



module.exports = router