import {
  HTTP
} from './request.js'

class CargoModel extends HTTP {

  // 获取首页所有货物
  getAllCargo() {
    return this.request({
      url: '/BeerApp/cargo/getAll'
    })
  }
  //
  getCargoById(id){
    return this.request({
      url: '/BeerApp/cargo/get.do?id='+id
    })
  }
}
export {
  CargoModel
}