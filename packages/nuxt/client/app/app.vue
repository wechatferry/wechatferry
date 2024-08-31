<template>
  <NuxtLoadingIndicator />
  <PageLayout>
    <NuxtPage />
  </PageLayout>
</template>

<style lang="css">
::-webkit-scrollbar {
    width: 6px
}

::-webkit-scrollbar:horizontal {
    height: 6px
}

::-webkit-scrollbar-corner {
    background: transparent
}

::-webkit-scrollbar-track {
    background: var(--c-border);
    border-radius: 1px
}

::-webkit-scrollbar-thumb {
    background: #8881;
    border-radius: 1px;
    -webkit-transition: background .2s ease;
    transition: background .2s ease
}

::-webkit-scrollbar-thumb:hover {
    background: #8885
}

.no-scrollbar::-webkit-scrollbar {
    display: none;
    height: 0!important;
    width: 0!important
}
</style>
