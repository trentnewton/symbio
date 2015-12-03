<div class="search-result">
  <h3 class="title">
    <a href="<?php print $url; ?>"><?php print $title; ?></a>
  </h3>
  <div class="search-snippet-info">
  <?php if ($info) : ?>
    <p class="search-info"><?php print $info; ?></p>
  <?php endif; ?>
  <?php if ($snippet) : ?>
    <p class="search-snippet"><?php print $snippet; ?></p>
  <?php endif; ?>
  </div>
  <hr>
</div>