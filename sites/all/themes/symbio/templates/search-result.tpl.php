<div class="search-result">
  <h4>
    <a href="<?php print $url; ?>"><?php print $title; ?></a>
  </h4>
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