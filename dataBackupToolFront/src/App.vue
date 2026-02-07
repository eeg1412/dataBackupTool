<template>
  <div>
    <nav>
      <router-link to="/">Home</router-link>
      |
      <router-link to="/about">About</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style scoped>
nav {
  padding: 1rem;
}
nav a {
  margin-right: 0.5rem;
  color: #42b883;
  text-decoration: none;
}
</style>
