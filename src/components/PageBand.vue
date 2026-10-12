<template>
  <section class="band">
    <div class="texture" aria-hidden="true"></div>
    <div class="band-in">
      <div class="lead">
        <!-- 面包屑：最后一项是当前页，不可点 -->
        <nav v-if="crumb.length" class="crumb">
          <template v-for="(c, i) in crumb" :key="i">
            <router-link v-if="c.to && i < crumb.length - 1" :to="c.to">{{ c.text }}</router-link>
            <b v-else>{{ c.text }}</b>
            <span v-if="i < crumb.length - 1" class="sep">/</span>
          </template>
        </nav>
        <h1>{{ title }}</h1>
        <p v-if="desc">{{ desc }}</p>
      </div>

      <!-- 右侧：关键数字 / 主要动作（移动端自动换行到标题下方） -->
      <div v-if="$slots.side" class="side">
        <slot name="side" />
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'PageBand',
  props: {
    // [{ text, to? }]，最后一项为当前页
    crumb: { type: Array, default: () => [] },
    title: { type: String, required: true },
    desc: { type: String, default: '' }
  }
}
</script>

<style scoped>
/* 内页的"首页式"深色首屏：通栏铺满、页头透明压在上面 */
.band {
  position: relative;
  overflow: hidden;
  background: var(--bg-dark);
  color: #fff;
  /* 上移一个页头高度，让深色带钻到透明页头下面（与首页一致） */
  margin-top: calc(var(--header-h) * -1);
  padding-top: calc(var(--header-h) + 56px);
  padding-bottom: 72px;
}
.band::after {
  content: "";
  position: absolute;
  width: 1000px;
  height: 560px;
  right: -160px;
  top: -240px;
  background: radial-gradient(closest-side, rgba(29, 59, 214, 0.55), transparent 70%);
  pointer-events: none;
}
.texture {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: radial-gradient(120% 90% at 70% 0%, #000 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(120% 90% at 70% 0%, #000 30%, transparent 75%);
  pointer-events: none;
}
.band-in {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: var(--wrap-app);
  margin: 0 auto;
  padding: 0 var(--s-6);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 48px;
}
.lead {
  min-width: 0;
}
.crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 14px;
}
.crumb a {
  color: rgba(255, 255, 255, 0.5);
}
.crumb a:hover {
  color: #fff;
}
.crumb b {
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
}
.sep {
  color: rgba(255, 255, 255, 0.28);
}
h1 {
  margin: 0;
  font-size: var(--font-hero);
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-weight: 600;
}
p {
  margin: 20px 0 0;
  max-width: 640px;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.7);
}
.side {
  display: flex;
  align-items: flex-end;
  gap: 32px;
  flex-shrink: 0;
}

@media (max-width: 1000px) {
  .band {
    padding-top: calc(var(--header-h) + 36px);
    padding-bottom: 56px;
  }
  .band-in {
    flex-direction: column;
    align-items: flex-start;
    gap: 30px;
  }
  .side {
    align-items: flex-start;
    gap: 24px;
  }
}
@media (max-width: 768px) {
  .band-in {
    padding: 0 var(--s-4);
  }
  p {
    font-size: 14px;
    margin-top: 16px;
  }
}
</style>
