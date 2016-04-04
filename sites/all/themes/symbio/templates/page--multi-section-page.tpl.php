<div id="top" class="off-canvas-wrapper docs-wrap">
  <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
    <div class="off-canvas position-left" id="offCanvas" data-off-canvas>
      <?php include ($directory."/partials/off-canvas-menu.php"); ?>
    </div>
    <div class="off-canvas-content" data-off-canvas-content>
      <main class="main-wrapper">
        <?php include ($directory."/partials/header.php"); ?>
      <?php if(!drupal_is_front_page()):?>
        <?php include ($directory."/partials/masthead.php"); ?>
        <?php if ($page['search']): ?>
        <section class="search-box">
          <?php print render($page['search']); ?>
        </section>
        <?php endif; ?>
        <?php if ($messages || $tabs || $page['content']) : ?>
        <div class="row column">
          <?php print $messages; ?>
          <div class="tabs-wrapper">
            <?php print render($tabs); ?>
          </div>
          <?php print render($page['content']); ?>
        </div>
        <?php endif; ?>
        <?php if ($page['first-category-section']): ?>
        <div id="main-content" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
          <article class="categories">
            <div class="row column" itemprop="text">
              <?php print render($page['first-category-section']); ?>
            </div>
          </article>
          <?php endif; ?>
          <?php if ($page['secondary-category-section']): ?>
          <article class="categories">
            <div class="row column" itemprop="text">
              <?php print render($page['secondary-category-section']); ?>
            </div>
          </article>
          <?php endif; ?>
          <?php if ($page['third-category-section']): ?>
          <article class="categories">
            <div class="row column" itemprop="text">
              <?php print render($page['third-category-section']); ?>
            </div>
          </article>
          <?php endif; ?>
          <?php if ($page['fourth-category-section']): ?>
          <article class="categories">
            <div class="row column" itemprop="text">
              <?php print render($page['fourth-category-section']); ?>
            </div>
          </article>
          <?php endif; ?>
        </div>
      <?php endif;?>
      </main>
      <?php include ($directory."/partials/footer.php"); ?>
    </div>
  </div>
</div>