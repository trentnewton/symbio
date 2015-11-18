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
      <?php if ($messages): ?>
      <section class="regular-page">
        <div class="row">
          <div class="column">
            <?php print $messages; ?>
          </div>
        </div>
      </section>
      <?php endif; ?>
      <?php if ($page['first-category-section']): ?>
      <section class="categories">
        <div class="row">
          <div class="column">
            <?php print render($page['first-category-section']); ?>
          </div>
        </div>
      </section>
      <?php endif; ?>
      <?php if ($page['secondary-category-section']): ?>
      <section class="categories">
        <div class="row">
          <div class="column">
            <?php print render($page['secondary-category-section']); ?>
          </div>
        </div>
      </section>
      <?php endif; ?>
      <?php if ($page['third-category-section']): ?>
      <section class="categories">
        <div class="row">
          <div class="column">
            <?php print render($page['third-category-section']); ?>
          </div>
        </div>
      </section>
      <?php endif; ?>
      <?php if ($page['fourth-category-section']): ?>
      <section class="categories">
        <div class="row">
          <div class="column">
            <?php print render($page['fourth-category-section']); ?>
          </div>
        </div>
      </section>
      <?php endif; ?>
    <?php endif;?>
    </main>
    <?php include ($directory."/partials/footer.php"); ?>
    <a class="exit-off-canvas"></a>
  </div>
</div>