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
      <div class="row">
        <div class="column">
          <?php if ($messages || $tabs) : ?>
          <?php print $messages; ?>
          <div class="tabs">
            <?php print render($tabs); ?>
          </div>
          <?php else : ?>
          <?php endif; ?>
          <?php if ($page['content']): ?>
          <?php print render($page['content']); ?>
          <?php endif; ?>
        </div>
      </div>
      <?php if ($page['first-category-section']): ?>
      <div itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
        <article class="categories">
          <div class="row">
            <div class="column" itemprop="text">
              <?php print render($page['first-category-section']); ?>
            </div>
          </div>
        </article>
        <?php endif; ?>
        <?php if ($page['secondary-category-section']): ?>
        <article class="categories">
          <div class="row">
            <div class="column" itemprop="text">
              <?php print render($page['secondary-category-section']); ?>
            </div>
          </div>
        </article>
        <?php endif; ?>
        <?php if ($page['third-category-section']): ?>
        <article class="categories">
          <div class="row">
            <div class="column" itemprop="text">
              <?php print render($page['third-category-section']); ?>
            </div>
          </div>
        </article>
        <?php endif; ?>
        <?php if ($page['fourth-category-section']): ?>
        <article class="categories">
          <div class="row">
            <div class="column" itemprop="text">
              <?php print render($page['fourth-category-section']); ?>
            </div>
          </div>
        </article>
        <?php endif; ?>
      </div>
    <?php endif;?>
    </main>
    <?php include ($directory."/partials/footer.php"); ?>
    <a class="exit-off-canvas"></a>
  </div>
</div>