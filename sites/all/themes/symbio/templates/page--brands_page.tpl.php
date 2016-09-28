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
        <?php if ($messages || $tabs) : ?>
        <div class="row column">
          <?php print $messages; ?>
          <div class="tabs-wrapper">
            <?php print render($tabs); ?>
          </div>
        </div>
        <?php endif; ?>
        <div id="main-content" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
          <section class="split-boxes brands-sections">
            <?php print render($page['content']); ?>
          </section>
        </div>
      <?php endif;?>
      </main>
      <?php include ($directory."/partials/footer.php"); ?>
    </div>
  </div>
</div>