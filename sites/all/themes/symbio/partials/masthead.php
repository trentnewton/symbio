<section id="masthead" role="banner">
  <div class="row column">
    <?php if ($page['masthead']): ?>
    <div class="page-title enter-bottom">
      <?php print render($page['masthead']); ?>
    </div>
    <?php endif; ?>
    <div class="masthead-nav-container">
      <?php if (arg(0) == 'user' && is_numeric(arg(1)) ){ ?>
        <?php if ($tabs): ?>
        <div class="masthead-nav enter-bottom-1">
        <?php print render($tabs); ?>
        </div>
        <?php endif; ?>
      <?php } else { ?>
        <?php if ($page['masthead_nav']): ?>
        <div class="masthead-nav enter-bottom-1">
        <?php print render($page['masthead_nav']); ?>
        </div>
        <?php endif; ?>
      <?php } ?>
    </div>
  </div>
</section>