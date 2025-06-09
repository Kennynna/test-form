import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { Account } from '@/types/account';

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>(JSON.parse(localStorage.getItem('accounts') || '[]'));

  watch(accounts, (val) => {
    localStorage.setItem('accounts', JSON.stringify(val));
  }, { deep: true });

  function addAccount() {
    accounts.value.push({
      id: Date.now().toString(),
      labels: [],
      type: 'LDAP',
      login: '',
      password: null,
      errors: {},
    });
  }

  function removeAccount(id: string) {
    accounts.value = accounts.value.filter(acc => acc.id !== id);
  }

  function updateAccount(id: string, data: Partial<Account>) {
    const idx = accounts.value.findIndex(acc => acc.id === id);
    if (idx !== -1) {
      accounts.value[idx] = { ...accounts.value[idx], ...data };
    }
  }

  return { accounts, addAccount, removeAccount, updateAccount };
});