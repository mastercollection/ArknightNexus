<template>
  <div class="common-layout">
    <el-container>
    <el-container>
      <el-aside width="200px">Aside</el-aside>
      <el-main>
          <div>
            <el-text class="mx-1">Default</el-text>
            <el-text class="mx-1" type="primary">Primary</el-text>
            <el-text class="mx-1" type="success">Success</el-text>
            <el-text class="mx-1" type="info">Info</el-text>
            <el-text class="mx-1" type="warning">Warning</el-text>
            <el-text class="mx-1" type="danger">Danger</el-text>
          </div>
          <el-button type="primary">Primary</el-button>
          <el-button type="primary" @click="toggleDark()">
            Dark
          </el-button>
          <router-view />
        </el-main>
      </el-container>
      <el-footer/>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { toggleDark } from '~/composables'

</script>
