<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import type { AppSettings } from '@/types/settings'

const router = useRouter()
const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const form = reactive<AppSettings>({ ...settings.value })

watch(
  settings,
  (v) => {
    Object.assign(form, v)
  },
  { deep: true },
)

function onSave() {
  if (form.signalMin > form.signalMax) {
    ElMessage.warning('信号范围无效：最小值不能大于最大值')
    return
  }
  if (form.connectedDevicesMin > form.connectedDevicesMax) {
    ElMessage.warning('连接设备数范围无效：最小值不能大于最大值')
    return
  }
  if (form.vendorVirtualPercent < 0 || form.vendorVirtualPercent > 100) {
    ElMessage.warning('虚标比例需在 0%~100% 范围内')
    return
  }
  settingsStore.replaceAll({ ...form })
  ElMessage.success('配置已保存')
}

function onReset() {
  settingsStore.reset()
  Object.assign(form, settingsStore.settings)
  ElMessage.info('已恢复默认配置')
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="settings-view">
    <el-page-header class="page-head" @back="goHome">
      <template #content>
        <span class="page-title">应用配置</span>
      </template>
      <template #extra>
        <el-button @click="onReset">恢复默认</el-button>
        <el-button type="primary" @click="onSave">保存</el-button>
      </template>
    </el-page-header>

    <p class="hint">
      以下配置用于设备信息与限速诊断。保存后不会自动检测，请回到主页手动点击「开始检测 / 重新检测」。
    </p>

    <el-form label-position="top" class="form" @submit.prevent="onSave">
      <el-card shadow="never" class="block">
        <template #header>套餐信息</template>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="WiFi 套餐名称（对外）">
              <el-input v-model="form.planName" maxlength="64" show-word-limit placeholder="例如：畅享套餐 100GB" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item label="宣传高速流量（GB）">
              <el-input-number v-model="form.advertisedHighspeedGB" :min="1" :max="5000" :step="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item label="实际高速流量上限（GB）">
              <template #label>
                <span>实际高速流量上限（GB）</span>
                <el-tooltip content="用于测速与内部流量归一化；首页仅展示宣传套餐流量。" placement="top">
                  <span class="tip-icon" aria-label="说明">ⓘ</span>
                </el-tooltip>
              </template>
              <el-input-number v-model="form.actualHighspeedGB" :min="0.1" :max="5000" :step="0.1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="never" class="block">
        <template #header>设备信息（检测回填）</template>
        <el-row :gutter="16">
          <el-col :xs="24" :md="8">
            <el-form-item label="设备型号">
              <el-input v-model="form.deviceModel" maxlength="64" placeholder="例如：华为 E8372" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="网络制式">
              <el-select v-model="form.networkType" class="w-full">
                <el-option label="4G" value="4G" />
                <el-option label="5G" value="5G" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="运营商">
              <el-input v-model="form.operator" maxlength="32" placeholder="例如：中国移动" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item label="信号强度最小值（dBm）">
              <el-input-number v-model="form.signalMin" :min="-120" :max="-40" :step="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item label="信号强度最大值（dBm）">
              <el-input-number v-model="form.signalMax" :min="-120" :max="-40" :step="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item label="连接设备数（最小）">
              <el-input-number v-model="form.connectedDevicesMin" :min="0" :max="64" :step="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="6">
            <el-form-item label="连接设备数（最大）">
              <el-input-number v-model="form.connectedDevicesMax" :min="0" :max="64" :step="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="never" class="block">
        <template #header>限速规则（诊断用）</template>
        <el-row :gutter="16">
          <el-col :xs="24" :md="24">
            <el-form-item label="限速原因（检测结果）">
              <template #label>
                <span>限速原因（检测结果）</span>
                <el-tooltip content="信息检测与诊断结论将按该配置生成；商家虚标比例在「网速诊断」页展示。" placement="top">
                  <span class="tip-icon" aria-label="说明">ⓘ</span>
                </el-tooltip>
              </template>
              <el-select v-model="form.limitCause" class="w-full">
                <el-option label="网络正常" value="normal" />
                <el-option label="信号弱" value="signal_weak" />
                <el-option label="运营商限速" value="operator_limit" />
                <el-option label="商家流量虚标导致提前触发运营商限速" value="vendor_virtual_limit" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="商家虚标比例（%）">
              <template #label>
                <span>商家虚标比例（%）</span>
                <el-tooltip content="仅当限速原因为「商家流量虚标…」时在网速诊断页展示；首页不展示。" placement="top">
                  <span class="tip-icon" aria-label="说明">ⓘ</span>
                </el-tooltip>
              </template>
              <el-input-number v-model="form.vendorVirtualPercent" :min="0" :max="100" :step="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="弱信号阈值（dBm）">
              <template #label>
                <span>弱信号阈值（dBm）</span>
                <el-tooltip content="信号低于该值时，诊断优先判定为信号问题。" placement="top">
                  <span class="tip-icon" aria-label="说明">ⓘ</span>
                </el-tooltip>
              </template>
              <el-input-number v-model="form.weakSignalDbm" :min="-120" :max="-50" :step="1" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert
          class="mt-8"
          type="info"
          :closable="false"
          show-icon
          title="当选择“运营商限速”或“商家流量虚标导致提前触发运营商限速”时，诊断可给出去限速动作；选择“网络正常/信号弱”时，去限速按钮将禁用。"
        />
      </el-card>

      <div class="footer-actions">
        <el-button @click="goHome">返回主页</el-button>
        <el-button type="primary" native-type="submit">保存配置</el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.settings-view {
  flex: 1;
  padding: 16px 20px 32px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}
.page-head {
  margin-bottom: 12px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
}
.hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.block {
  border-radius: 12px;
}
.w-full {
  width: 100%;
}
.footer-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
}
.tip-icon {
  margin-left: 4px;
  cursor: help;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.mt-8 {
  margin-top: 8px;
}
</style>
