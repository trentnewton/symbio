<section id="masthead" role="banner">
  <div class="row">
    <div class="column">
      <?php if ($page['masthead']): ?>
      <div class="page-title" data-sr="enter bottom">
        <?php print render($page['masthead']); ?>
      </div>
      <?php endif; ?>
    <?php
    if (arg(0) == 'user' && is_numeric(arg(1)) && (arg(2) == NULL) ){ ?>
      <?php if ($tabs): ?>
      <div class="masthead-nav" data-sr="enter bottom wait 0.5s">
        <?php print render($tabs); ?>
      </div>
      <?php endif; ?>
    <?php } else { ?>
      <?php if ($page['masthead_nav']): ?>
      <div class="masthead-nav" data-sr="enter bottom wait 0.5s">
        <?php print render($page['masthead_nav']); ?>
      </div>
      <?php endif; ?>
    <?php } ?>
    </div>
  </div>
</section>