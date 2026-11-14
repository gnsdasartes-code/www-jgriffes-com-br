import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'storefront.spec.mjs',workers:1,timeout:30000,reporter:'list',use:{baseURL:'http://127.0.0.1:8080',browserName:'chromium',channel:'chrome',headless:true,viewport:{width:1440,height:1000},trace:'retain-on-failure'}});
