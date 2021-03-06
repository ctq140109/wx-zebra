import {
  AddressModel
} from '../../service/address.js';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    navigationBarTitle: '',
    address: '', //传给后台的地址
    location: {},
    addrid: '',
    name: '',
    mobile: '',
    detailed: '',
    defalut: false,
    editFlag: false
  },
  bindKeyName: function(e) {
    this.setData({
      name: e.detail.value
    })
  },
  bindKeyMobile: function(e) {
    this.setData({
      mobile: e.detail.value
    })
  },
  bindKeyDetailed: function(e) {
    this.setData({
      detailed: e.detail.value
    })
  },
  toSearch() {
    wx.navigateTo({
      url: '../searchAddress/searchAddress?address=' + this.data.address,
    })
  },
  save: function() {
    var reg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1})|(17[0-9]{1}))+\d{8})$/;
    try {
      if (this.data.name == '') throw '请输入姓名';
      if (this.data.mobile == '') throw '请输入手机号码';
      if (!reg.test(this.data.mobile)) throw '手机号码格式错误';
      if (this.data.address == '') throw '请选择地址';
      if (this.data.detailed == '') throw '请输入详细地址';
    } catch (err) {
      this._showModal(err);
      return false;
    }
    let addressModel = new AddressModel();
    let address = this.data.address;
    if (wx.getStorageSync("openid") != "") {
      if (this.data.editFlag == false) {
        addressModel.addAddress(wx.getStorageSync("openid"), this.data.name, this.data.mobile, address, this.data.detailed, this.data.location.lat, this.data.location.lng)
          .then(res => {
            console.log(res);
            this.backFlash();
          })
      } else {
        addressModel.editAddress(this.data.addrid, wx.getStorageSync("openid"), this.data.name, this.data.mobile, address, this.data.detailed, this.data.location.lat, this.data.location.lng)
          .then(res => {
            console.log(res);
            this.backFlash();
          })
      }
    }
  },
  backFlash: function() {
    wx.showToast({
      title: '已保存！',
    })
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2]; //上一个页面
    // prevPage.onLoad();
    wx.navigateBack({
      success: function() {
        prevPage.onLoad(); // 执行前一个页面的onLoad方法
      }
    })
  },
  _showModal: function(msg) {
    wx.showModal({
      title: '温馨提示',
      content: msg,
      showCancel: false
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let item = wx.getStorageSync("addressItem");
    console.log(item);
    if (item != "") {
      wx.setNavigationBarTitle({
        title: '编辑地址'
      })
      this.setData({
        navigationBarTitle:'编辑地址'
      })
      let items = JSON.parse(item);
      let state = items.state == 1 ? true : false;
      this.setData({
        editFlag: true,
        addrid: items.id,
        address: items.city,
        name: items.receiver,
        location: {
          lat: items.lat,
          lng: items.lng
        },
        mobile: items.phone,
        detailed: items.addr,
        defalut: state
      });
      wx.removeStorageSync("addressItem");
    } else {
      wx.setNavigationBarTitle({
        title: '新增地址'
      })
      this.setData({
        navigationBarTitle: '新增地址'
      })
    }
  },
  //获取地址搜索的结果
  getLocation() {
    let item = wx.getStorageSync("locationItem");
    if (item != '') {
      item = JSON.parse(item);
      this.setData({
        // title: item.title,
        location: item.location,
        address: item.address
      });
      wx.removeStorageSync("locationItem");
    }
  }
})