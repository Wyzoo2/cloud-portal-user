<template>
  <el-input :model-value="yuan" :placeholder="placeholder || '请输入金额（元）'"
    :disabled="disabled" inputmode="decimal" clearable
    @update:model-value="onInput" @blur="onBlur" />
</template>

<script>
export default {
  name: 'AmountInput',
  props: {
    // 金额，单位分；null 表示未填
    modelValue: { type: [Number, String], default: null },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    return { yuan: centsToYuanText(this.modelValue) }
  },
  watch: {
    modelValue(v) {
      // 外部改值（如重置）才回写，用户正在输入时不打断
      if (parseYuanToCents(this.yuan) !== Number(v)) this.yuan = centsToYuanText(v)
    }
  },
  methods: {
    onInput(v) {
      this.yuan = v
      this.$emit('update:modelValue', parseYuanToCents(v))
    },
    onBlur() {
      this.yuan = centsToYuanText(this.modelValue)
    }
  }
}

/** 元字符串 → 分（整数）；非法返回 null。用字符串拆分，不用浮点参与金额运算 */
function parseYuanToCents(str) {
  const s = String(str == null ? '' : str).trim().replace(/,/g, '')
  if (!s) return null
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null
  const [intPart, decPart = ''] = s.split('.')
  return Number(intPart) * 100 + Number((decPart + '00').slice(0, 2))
}

function centsToYuanText(cents) {
  if (cents == null || cents === '') return ''
  const n = Number(cents)
  return Math.trunc(n / 100) + '.' + String(n % 100).padStart(2, '0')
}
</script>
