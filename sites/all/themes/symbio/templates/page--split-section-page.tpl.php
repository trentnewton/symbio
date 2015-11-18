<div class="off-canvas-wrap docs-wrap" data-offcanvas="">
  <div class="inner-wrap">
    <main id="main-wrapper">
      <?php include ($directory."/partials/header.php"); ?>
    <?php if(!drupal_is_front_page()):?>
      <section id="masthead">
        <div class="row">
          <div class="column">
            <?php if ($page['masthead']): ?>
            <div class="page-title" data-sr="enter bottom">
              <?php print render($page['masthead']); ?>
            </div>
            <?php endif; ?>
            <?php if ($page['masthead_nav']): ?>
            <div class="masthead-nav" data-sr="enter bottom wait 0.5s">
              <?php print render($page['masthead_nav']); ?>
            </div>
            <?php endif; ?>
          </div>
        </div>
      </section>
      <?php if ($page['search']): ?>
      <section id="search-box">
        <?php print render($page['search']); ?>
      </section>
      <?php endif; ?>
      <section class="split-boxes" data-equalizer data-equalizer-mq="medium-up">
        <div class="columns medium-6 collapse split-box-left regular-page" data-equalizer-watch>
          <div class="row-split">
            <?php if ($messages): ?>
            <?php print $messages; ?>
            <?php endif; ?>
            <?php if ($tabs): ?>
            <div class="tabs">
              <?php print render($tabs); ?>
            </div>
            <?php endif; ?>
            <?php if ($page['content']): ?>
            <?php print render($page['content']); ?>
            <?php endif; ?>
            <?php print $messages; ?>
            <?php if ($page['split-box-left']): ?>
            <?php print render($page['split-box-left']); ?>
            <?php endif; ?>
          </div>
        </div>
        <div class="column medium-6 collapse split-box-right google-maps-container" data-equalizer-watch>
        <?php if ($page['split-box-right']): ?>
          <?php print render($page['split-box-right']); ?>
        <?php endif; ?>
        </div>
      </section>
    <?php endif;?>
    </main>
    <?php include ($directory."/partials/footer.php"); ?>
    <a class="exit-off-canvas"></a>
  </div>
</div>