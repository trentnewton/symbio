<?php if ($search_results) : ?>
  <h2><?php print t('Search results');?></h2>
  <?php if (isset($filter) && $filter != '' && $filter_position == 'above') : ?>
    <div class="custom-search-filter">
      <?php print $filter; ?>
    </div>
  <?php endif; ?>
  <div class="search-results <?php print $module; ?>-results">
    <?php print $search_results; ?>
  </div>
  <?php if (isset($filter) && $filter != '' && $filter_position == 'below') : ?>
    <div class="custom-search-filter">
      <?php print $filter; ?>
    </div>
  <?php endif; ?>
  <?php print $pager; ?>
<?php else : ?>
  <h2><?php print t('Your search yielded no results');?></h2>
  <?php print search_help('search#noresults', drupal_help_arg()); ?>
<?php endif; ?>
