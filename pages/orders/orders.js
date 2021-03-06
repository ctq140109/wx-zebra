//js
var sliderWidth = 0; // 需要设置slider的宽度，用于计算中间位置
const app = getApp();
import {
  OrdersModel
} from '../../service/orders.js';
import {
  CargoModel
} from '../../service/cargo.js';
import {
  PayModel
} from '../../service/pay.js';
import {
  ShopModel
} from '../../service/shop.js';
import {
  Tool
} from '../../public/tool.js';
Page({
  data: {
    imgBaseUrl: '',
    tabs: ["全部", "待付款", "待发货", "待收货", "待评价"],
    sliderWidth: 0,
    activeIndex: 0,
    sliderOffset: 0,
    // sliderLeft: 0,
    // orderList: [],
    orderLists: [],
    nowPage: 1,
    totalNum: 0,
    index: 0,
    orderList: [],
    _from: 0, //是否来自支付结果页
    CustomBar: app.globalData.CustomBar
  },
  onLoad: function(options) {
    wx.showLoading({
      title: '加载中',
    })
    console.log(options);
    this.setData({
      index: options.index
    })
    if (options._from != undefined) {
      this.setData({
        _from: options._from
      })
    }
    if (options.index != undefined) {
      var that = this;
      let ordersModel = new OrdersModel();
      wx.getSystemInfo({
        success: function(res) {
          let req1 = ordersModel.getAllOrders(options.index, that.data.nowPage);
          let req2 = ordersModel.getEvaOrder(1);
          Promise.all([req1, req2]).then(resd => {
            console.log(resd[0], resd[1]);
            let resp = resd[0];
            let resp1 = resd[1];
            let tool = new Tool();
            for (let k of resp1.data) {
              // k.totalPrice = (k.quantity * k.price).toFixed(2);
              k.totalPrice = tool.multiple(k.quantity, k.price);
            }
            for (let j = 0; j < resp.data.list.length; j++) {
              for (let i = 0; i < resp.data.list[j].cargoList.length; i++) {
                resp.data.list[j].cargoList[i].imgUrl = resp.data.list[j].cargoList[i].img.split(",")[0];
              }
              that.data.orderList.push(resp.data.list[j]);
            }
            that.setData({
              imgBaseUrl: app.globalData.imgBaseUrl,
              orderList: that.data.orderList,
              orderLists: resp1.data,
              totalNum: resp.data.total,
              activeIndex: options.index,
              sliderWidth: res.windowWidth / that.data.tabs.length,
              sliderOffset: res.windowWidth / that.data.tabs.length * options.index
            });
            wx.hideLoading();
            wx.stopPullDownRefresh();
          })
        }
      });
    }
  },
  tabClick: function(e) {
    this.setData({
      orderList: [],
      nowPage: 1
    })
    this.onLoad({
      index: e.currentTarget.id
    });
  },
  //取消订单
  cancleOrder: function(e) {
    let id = e.currentTarget.dataset.idx;
    console.log(id);
    var that = this;
    wx.showModal({
      title: '温馨提示',
      content: '确认取消订单？',
      success: function(res) {
        if (res.confirm) {
          let ordersModel = new OrdersModel();
          ordersModel.cancelOrder(id).then(res => {
            console.log(res);
            if (res.data == 0) {
              wx.showToast({
                title: '操作失败！',
                icon: 'none'
              })
            } else {
              that.tabClick({
                currentTarget: {
                  id: that.data.activeIndex
                }
              })
            }
          })
        }
      }
    })
  },
  preBuy: function(e) {
    let shopModel = new ShopModel();
    var that = this;
    shopModel.getStatus().then(res => {
      console.log(res);
      wx.setStorageSync("timeFlag", res.data);
      if (!res.data) {
        wx.showModal({
          title: '温馨提示',
          content: '当前门店已休息，付款后订单发货需到营业时间内发货，确认付款吗？',
          success(res) {
            if (res.confirm) {
              that.paypay(e);
            }
          }
        })
      }else{
        that.paypay(e);
      }
    })
  },
  //立即付款
  paypay: function(e) {
    console.log(e);
    var that = this;
    let trade_no = e.currentTarget.dataset.item.id;
    let typeId = e.currentTarget.dataset.item.type;
    // let total_fee = e.currentTarget.dataset.item.price * 100;
    // let body = '斑马-超市'; //商品描述
    // let openid = wx.getStorageSync("openid");
    let nonceStr = e.currentTarget.dataset.item.nonceStr;
    let timestamp = e.currentTarget.dataset.item.timestamp;
    let packages = e.currentTarget.dataset.item.packages;
    let sign = e.currentTarget.dataset.item.sign;
    //调支付接口
    wx.requestPayment({
      timeStamp: timestamp,
      nonceStr: nonceStr,
      package: packages,
      paySign: sign,
      signType: 'MD5',
      success(res) {
        console.log(res);
        wx.showToast({
          title: '支付成功！',
          duration: 1000,
          mask: true
        })
        setTimeout(() => {
          // let status = 2;
          // if (typeId == 2) {
          //   status = 4
          // }
          //支付成功,待发货订单
          // let ordersModel = new OrdersModel();
          // ordersModel.updateOrders(trade_no, 2, typeId).then(res => {
          //   console.log(res);
            that.tabClick({
              currentTarget: {
                id: that.data.activeIndex
              }
            })
          // })
        }, 1000)
      },
      fail(res) {
        console.log(res);
        //失败,待付款订单
        wx.showToast({
          title: '支付失败！',
          icon: "none"
        });
      }
    })
  },
  //退款后取消订单
  refund: function(e) {
    let item = e.currentTarget.dataset.item;
    console.log(item);
    wx.setStorageSync('refund', JSON.stringify(item));
    wx.navigateTo({
      url: '../refund/refund',
    })
  },
  //收货
  comfirmReceipt: function(e) {
    console.log(e);
    var that = this;
    let id = e.currentTarget.dataset.item.id;
    let typeId = e.currentTarget.dataset.item.type;
    wx.showModal({
      title: '温馨提示',
      content: '确认收货？',
      success: function(res) {
        if (res.confirm) {
          let ordersModel = new OrdersModel();
          ordersModel.updateOrders(id, 4, typeId).then(resp => {
            console.log(resp);
            that.tabClick({
              currentTarget: {
                id: that.data.activeIndex
              }
            })
          })
        }
      }
    })
  },
  //去评价页
  toEvaluate: function(e) {
    let id = e.currentTarget.dataset.idx;
    let cargoid = e.currentTarget.dataset.cargoid;
    let specId = e.currentTarget.dataset.specid;
    // let typeid = e.currentTarget.dataset.typeid;
    console.log(id, cargoid, specId);
    wx.navigateTo({
      url: '../evaluation/evaluation?id=' + id + '&cargoid=' + cargoid + '&specid=' + specId,
    })
  },
  loadingMore: function() {
    let nowPage = this.data.nowPage;
    nowPage++;
    this.setData({
      nowPage: nowPage
    });
    //
    this.onLoad({
      index: this.data.index
    });
  },
  toDetail: function(e) {
    wx.showLoading({
      title: '加载中',
    })
    var item = e.currentTarget.dataset.cargo;
    console.log(item);
    let cargoModel = new CargoModel();
    cargoModel.getCargoById(item.cargoId).then(res => {
      console.log(res.data);
      res.data.imgArr = res.data.cargoImg.split(',');
      wx.hideLoading();
      wx.navigateTo({
        url: '../detail/detail?cargoItem=' + JSON.stringify(res.data)
      });
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    console.log('页面上拉触底事件的处理函数', this.data.totalNum);
    if (this.data.totalNum > this.data.orderList.length) {
      this.loadingMore();
    }
  },
  onUnload: function() {
    //判断是否从支付结果页跳转过来
    if (this.data._from == 1) {
      wx.switchTab({
        url: '../center/center'
      })
    }
  },
  onPullDownRefresh(){
    this.setData({
      orderList: [],
      nowPage: 1
    })
    this.onLoad({
      index: this.data.activeIndex
    })
  }
});