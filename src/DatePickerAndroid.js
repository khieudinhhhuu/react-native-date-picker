import React from 'react'
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  TurboModuleRegistry,
  requireNativeComponent,
} from 'react-native'
import { shouldCloseModal, shouldOpenModal } from './modal'

const NativeDatePicker =
  Platform.OS === 'android'
    ? requireNativeComponent('RNDatePicker', DatePickerAndroid, {
        nativeOnly: { onChange: true },
      })
    : null

const height = 180
const timeModeWidth = "100%"
const defaultWidth = 310

const NativePicker = TurboModuleRegistry
  ? TurboModuleRegistry.get('RNDatePicker')
  : NativeModules.RNDatePicker

class DatePickerAndroid extends React.PureComponent {
  render() {
    const props = this.getProps()

    if (shouldOpenModal(props, this.previousProps)) {
      this.isClosing = false
      NativePicker.openPicker(props)
    }
    if (shouldCloseModal(props, this.previousProps, this.isClosing)) {
      this.closing = true
      NativePicker.closePicker()
    }

    this.previousProps = props

    if (props.modal) return null

    return <NativeDatePicker {...props} onChange={this._onChange} />
  }

  getId = () => {
    if (!this.id) {
      this.id = Math.random().toString()
    }
    return this.id
  }

  componentDidMount = () => {
    this.eventEmitter = new NativeEventEmitter(NativePicker)
    this.eventEmitter.addListener('dateChange', this._onChange)
    this.eventEmitter.addListener('onConfirm', this._onConfirm)
    this.eventEmitter.addListener('onCancel', this._onCancel)
  }

  componentWillUnmount = () => {
    this.eventEmitter.removeAllListeners('dateChange')
    this.eventEmitter.removeAllListeners('onConfirm')
    this.eventEmitter.removeAllListeners('onCancel')
  }

  getProps = () => ({
    ...this.props,
    date: this._date(),
    id: this.getId(),
    minimumDate: this._minimumDate(),
    maximumDate: this._maximumDate(),
    timezoneOffsetInMinutes: this._getTimezoneOffsetInMinutes(),
    style: this._getStyle(),
  })

  _getTimezoneOffsetInMinutes = () => {
    if (this.props.timeZoneOffsetInMinutes == undefined) return undefined
    return this.props.timeZoneOffsetInMinutes
  }

  _getStyle = () => {
    const width = this.props.mode === 'time' ? timeModeWidth : defaultWidth
    return [{ width, height }, this.props.style]
  }

  _onChange = (e) => {
    const { date, id, dateString } = e.nativeEvent ?? e
    const newArch = id !== null
    if (newArch && id !== this.id) return
    const jsDate = this._fromIsoWithTimeZoneOffset(date)
    this.props.onDateChange && this.props.onDateChange(jsDate)
    if (this.props.onDateStringChange) {
      this.props.onDateStringChange(dateString)
    }
  }

  _maximumDate = () =>
    this.props.maximumDate &&
    this._toIsoWithTimeZoneOffset(this.props.maximumDate)

  _minimumDate = () =>
    this.props.minimumDate &&
    this._toIsoWithTimeZoneOffset(this.props.minimumDate)

  _date = () => this._toIsoWithTimeZoneOffset(this.props.date)

  _fromIsoWithTimeZoneOffset = (timestamp) => {
    return new Date(timestamp)
  }

  _toIsoWithTimeZoneOffset = (date) => {
    return date.toISOString()
  }

  _onConfirm = ({ date, id }) => {
    if (id !== this.id) return
    this.isClosing = true
    this.props.onConfirm(this._fromIsoWithTimeZoneOffset(date))
  }

  _onCancel = ({ id }) => {
    if (id !== this.id) return
    this.isClosing = true
    this.props.onCancel()
  }
}

export default DatePickerAndroid
