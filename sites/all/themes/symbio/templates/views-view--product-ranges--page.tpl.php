<?php
$termid = arg(2);
$term = taxonomy_term_load($termid);
$title = $term->name;
?>
<div class="<?php print $classes; ?> view-product-ranges-page">
  <header class="major-header"><h2><?php if ($title): ?><?php print $title; ?><?php endif; ?></h2></header>
  <?php if ($rows): ?>
      <?php print $rows; ?>
  <?php endif; ?>
</div>