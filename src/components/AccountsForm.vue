<template>
  <div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <h2>Учетные записи</h2>
      <el-button @click="addAccount" type="primary" circle :icon="Plus" />
    </div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin: 8px 0 16px 0; padding: 8px 16px;"
      description="Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;"
    />

    <div class="accounts-table">
      <div class="accounts-header">
        <span>Метки</span>
        <span>Тип записи</span>
        <span>Логин<span class="required">*</span></span>
        <span>Пароль<span class="required">*</span></span>
        <span></span>
      </div>
      <div
        v-for="account in accounts"
        :key="account.id"
        class="accounts-row"
      >
          <el-input
            v-model="labelsInput[account.id]"
            @blur="onLabelsBlur(account)"
            maxlength="50"
            placeholder="Метки"
            clearable
          />
        <el-select
          v-model="account.type"
          @change="onTypeChange(account)"

        >
          <el-option label="Локальная" value="Локальная" />
          <el-option label="LDAP" value="LDAP" />
        </el-select>
        <div class="input-wrapper">
          <el-input
            :class="{ 'is-error': account.errors?.login }"
            v-model="account.login"
            @blur="onLoginBlur(account)"
            maxlength="100"
            placeholder="Логин"
            clearable
            :title="account.errors?.login ? 'Это поле обязательно для заполнения' : ''"
          />
        </div>
        <div class="input-wrapper" v-if="account.type === 'Локальная'">
          <el-input
            :class="{ 'is-error': account.errors?.password }"
            v-model="account.password"
            @blur="onPasswordBlur(account)"
            maxlength="100"
            placeholder="Пароль"
            show-password
            clearable
            :title="account.errors?.password ? 'Это поле обязательно для заполнения' : ''"
          />
        </div>
        <span v-else></span>
        <el-button
          @click="removeAccount(account.id)"
          type="danger"
          circle
          :icon="Delete"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAccountsStore } from '@/stores/accounts';
import { Plus, Delete } from '@element-plus/icons-vue';
import type { Account } from '@/types/account';

const store = useAccountsStore();
const accounts = computed(() => store.accounts);

// Для ввода меток (чтобы не хранить строку в store)
const labelsInput = ref<Record<string, string>>({});

// Инициализация labelsInput при загрузке
watch(accounts, (val) => {
  val.forEach(acc => {
    labelsInput.value[acc.id] = acc.labels.map(l => l.text).join('; ');
  });
}, { immediate: true });

const validationTimeouts = ref<Record<string, number>>({});

function addAccount() {
  store.addAccount();
}

function removeAccount(id: string) {
  if (validationTimeouts.value[id]) {
    clearTimeout(validationTimeouts.value[id]);
    delete validationTimeouts.value[id];
  }
  store.removeAccount(id);
  delete labelsInput.value[id];
}

function validateAccount(account: Account) {
  // Очищаем предыдущий таймаут если он есть
  if (validationTimeouts.value[account.id]) {
    clearTimeout(validationTimeouts.value[account.id]);
  }

  // Устанавливаем новый таймаут
  validationTimeouts.value[account.id] = setTimeout(() => {
    const value = labelsInput.value[account.id] || '';
    const labels = value
      .split(';')
      .map(label => label.trim())
      .filter(label => label.length > 0)
      .map(text => ({ text }));

    const errors = {
      labels: value.length > 50,
      login: !account.login || account.login.length > 100,
      password: account.type === 'Локальная' ? (!account.password || account.password.length > 100) : false
    };

    store.updateAccount(account.id, {
      labels,
      errors
    });
  }, 500);
}

function onLabelsBlur(account: Account) {
  validateAccount(account);
}

function onTypeChange(account: Account) {
  if (account.type === 'LDAP') {
    store.updateAccount(account.id, {
      password: null,
      errors: { ...account.errors, password: false }
    });
  } else {
    validateAccount(account);
  }
}

function onLoginBlur(account: Account) {
  validateAccount(account);
}

function onPasswordBlur(account: Account) {
  validateAccount(account);
}
</script>

<style scoped>
.accounts-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.accounts-header, .accounts-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 0.5fr;
  gap: 8px;
  align-items: center;
  width: 100% !important;
}
.accounts-header {
  font-weight: bold;
  color: #888;
  margin-bottom: 4px;
}
.accounts-header span:nth-child(2) {
  width: 100%;
  justify-self: stretch;
}
:deep(.el-input.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-danger) !important;
}
:deep(.el-input.is-error .el-input__inner) {
  border-color: var(--el-color-danger) !important;
}
.accounts-row .el-select {
  width: 100%;
}
.required {
  color: red;
  margin-left: 2px;
}
.input-wrapper {
  position: relative;
  width: 100%;
}
</style>
