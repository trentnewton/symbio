<div class="off-canvas-wrap docs-wrap" data-offcanvas="">
  <div class="inner-wrap">
    <main id="main-wrapper">
      <?php include ($directory."/partials/header.php"); ?>
    <?php if(!drupal_is_front_page()):?>
      <?php include ($directory."/partials/masthead.php"); ?>
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
      <?php if ($page['content']): ?>
      <?php print render($page['content']); ?>
      <?php endif; ?>
      <?php if ($page['first-category-section']): ?>
      <article class="categories">
        <div class="row">
          <div class="column">
            <?php print render($page['first-category-section']); ?>
          </div>
        </div>
      </article>
      <?php endif; ?>
      <?php if ($page['secondary-category-section']): ?>
      <article class="categories">
        <div class="row">
          <div class="column">
            <?php print render($page['secondary-category-section']); ?>
          </div>
        </div>
      </article>
      <?php endif; ?>
      <?php if ($page['third-category-section']): ?>
      <article class="categories">
        <div class="row">
          <div class="column">
            <?php print render($page['third-category-section']); ?>
          </div>
        </div>
      </article>
      <?php endif; ?>
      <?php if ($page['fourth-category-section']): ?>
      <article class="categories">
        <div class="row">
          <div class="column">
            <?php print render($page['fourth-category-section']); ?>
          </div>
        </div>
      </article>
      <?php endif; ?>
    <?php endif;?>
    </main>
    <?php include ($directory."/partials/footer.php"); ?>
    <a class="exit-off-canvas"></a>
  </div>
</div>