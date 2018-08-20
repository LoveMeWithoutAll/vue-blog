<template>
  <div class="comments">
    <vue-disqus shortname="book-blog-1" :identifier="postKey"></vue-disqus>
  </div>
</template>

<script>
export default {
  props: ['postKey']
}
</script>

<style>

</style>
