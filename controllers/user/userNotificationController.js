const prisma = require("../../config/prismaConfig");
const { NotFoundError, ValidationError } = require("../../resHandler/CustomError");
const { handlerOk } = require("../../resHandler/responseHandler");
const { message } = require("../../schema/user/content");


const showAllNotification = async (req, res, next) => {
  try {

    const { id } = req.user;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: id,
      },
      include: {
        user: {
          select: {
            userName: true,
            image: true
          },
        },
        // game:true
        game:{
          include:{
            invitedFriends:true
          }
        }
      }
    })

    if (notifications.length === 0) {
      // throw new NotFoundError("notifications not found")
      return res.status(200).json({
        success:true,
        message:"notification not found",
        data:[]
      })
    }


    handlerOk(res, 200, notifications, 'notifications found successfully')



  } catch (error) {
    next(error)
  }
}

const readNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId
      }
    });

    if (!notification) {
      throw new NotFoundError("notification id not found")
    }

    const readnotification = await prisma.notification.update({
      where: {
        id: notification.id
      },
      data: {
        isRead: true
      }
    });

    if (!readnotification) {
      throw new ValidationError("notification is not read")
    }

    handlerOk(res, 200, readnotification, 'notification read successfully')


  } catch (error) {
    next(error)
  }
}

const onAndOffNotification = async (req, res, next) => {
  try {
    let { notificationOnAndOff, id } = req.user;

    notificationOnAndOff = !notificationOnAndOff;

    let message = notificationOnAndOff
      ? "Notification On Successfully"
      : "Notification Off Successfully";

    await prisma.user.update({
      where: {
        id: id
      },
      data: {
        notificationOnAndOff: notificationOnAndOff
      }
    })

    handlerOk(res, 200, null, message)

  } catch (error) {
    next(error)
  }
}

const rejectRequest=async (req,res,next) => {
  try {
    const {notificationId}=req.params;

     const findnotification=await prisma.notification.findUnique({
      where:{
        id:notificationId
      }
    });

    if(!findnotification){
      throw new NotFoundError("notification not found")
    }

    const deletenotification=await prisma.notification.delete({
      where:{
        id:findnotification.id
      }
    });

    if(!deletenotification){
      throw new ValidationError("notification not delete")
    }

    handlerOk(res,200,null,"reject request successfully")
  } catch (error) {
    next(error)
  }
}

module.exports = {
  showAllNotification,
  readNotification,
  onAndOffNotification,
  rejectRequest
}