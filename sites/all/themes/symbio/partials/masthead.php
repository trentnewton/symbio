<section id="masthead" role="banner">
  <div class="row">
    <div class="column">
      <?php if ($page['masthead']): ?>
      <div class="page-title" data-sr="enter bottom">
        <?php print render($page['masthead']); ?>
      </div>
      <?php endif; ?>
      <div class="masthead-nav-container">
        <div class="masthead-nav" data-sr="enter bottom wait 0.5s">
        <?php if (arg(0) == 'user' && is_numeric(arg(1)) ){ ?>
          <?php if ($tabs): ?>
          <?php print render($tabs); ?>
          <?php endif; ?>
        <?php } else { ?>
          <?php if ($page['masthead_nav']): ?>
          <?php print render($page['masthead_nav']); ?>
          <?php endif; ?>
        <?php } ?>
        </div>
      </div>
    </div>
  </div>
</section>