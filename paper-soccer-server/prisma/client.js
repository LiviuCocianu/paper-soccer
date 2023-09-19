import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Use PrismaClient to make database queries. Automatic connection close
 * @param {function(PrismaClient):Promise<void>} func
 * @param {function(Error):void} errorFunc
 */
export const query = (func, errorFunc=undefined) => {
    func(prisma).then(async () => {
        await prisma.$disconnect()
    }).catch(async (e) => {
        if(errorFunc) errorFunc(e)
        await prisma.$disconnect()
    })
}